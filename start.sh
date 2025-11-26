#!/bin/bash

# eBay Clone - Start Script
# This script checks for PostgreSQL, sets up the database, and starts both backend and frontend

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
DATABASE_DIR="$SCRIPT_DIR/database"

# Application ports
BACKEND_PORT=4000
FRONTEND_PORT=3000

# Database configuration (can be overridden by .env file)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-ebay_clone}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║                    eBay Clone                             ║"
echo "║              Professional Marketplace                     ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to kill processes on a specific port
kill_port() {
    local port=$1
    echo -e "${YELLOW}Checking port $port...${NC}"

    # Find and kill processes on the port
    local pids=$(lsof -ti :$port 2>/dev/null)

    if [ -n "$pids" ]; then
        echo -e "${YELLOW}Killing processes on port $port: $pids${NC}"
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 1
        echo -e "${GREEN}✓ Port $port cleared${NC}"
    else
        echo -e "${GREEN}✓ Port $port is available${NC}"
    fi
}

# Function to clean up ports before starting
clean_ports() {
    echo -e "${YELLOW}Cleaning up ports...${NC}"
    kill_port $FRONTEND_PORT
    kill_port $BACKEND_PORT
    echo ""
}

# Function to check if PostgreSQL is running
check_postgres() {
    echo -e "${YELLOW}Checking PostgreSQL connection...${NC}"

    # Try to connect to PostgreSQL
    if command_exists psql; then
        if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c '\q' 2>/dev/null; then
            echo -e "${GREEN}✓ PostgreSQL is running and accessible${NC}"
            return 0
        fi
    fi

    echo -e "${RED}✗ Cannot connect to PostgreSQL${NC}"
    echo ""
    echo -e "${YELLOW}Please ensure PostgreSQL is installed and running:${NC}"
    echo ""
    echo "  macOS (Homebrew):"
    echo "    brew install postgresql@15"
    echo "    brew services start postgresql@15"
    echo ""
    echo "  Ubuntu/Debian:"
    echo "    sudo apt install postgresql postgresql-contrib"
    echo "    sudo systemctl start postgresql"
    echo ""
    echo "  Windows:"
    echo "    Download from https://www.postgresql.org/download/windows/"
    echo "    Start PostgreSQL service from Services panel"
    echo ""
    echo -e "${YELLOW}Connection details:${NC}"
    echo "  Host: $DB_HOST"
    echo "  Port: $DB_PORT"
    echo "  User: $DB_USER"
    echo "  Database: $DB_NAME"
    echo ""
    return 1
}

# Function to create database if it doesn't exist
setup_database() {
    echo -e "${YELLOW}Setting up database...${NC}"

    # Check if database exists
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        echo -e "${GREEN}✓ Database '$DB_NAME' already exists${NC}"
    else
        echo -e "${YELLOW}Creating database '$DB_NAME'...${NC}"
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || {
            echo -e "${RED}Failed to create database. Please create it manually:${NC}"
            echo "  psql -U $DB_USER -c 'CREATE DATABASE $DB_NAME;'"
            return 1
        }
        echo -e "${GREEN}✓ Database created${NC}"
    fi

    return 0
}

# Function to check and install Node.js dependencies
install_dependencies() {
    echo -e "${YELLOW}Checking Node.js dependencies...${NC}"

    if ! command_exists node; then
        echo -e "${RED}✗ Node.js is not installed${NC}"
        echo "  Please install Node.js 18+ from https://nodejs.org/"
        return 1
    fi

    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo -e "${RED}✗ Node.js version 18+ required (found v$NODE_VERSION)${NC}"
        return 1
    fi
    echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

    if ! command_exists npm; then
        echo -e "${RED}✗ npm is not installed${NC}"
        return 1
    fi
    echo -e "${GREEN}✓ npm $(npm -v)${NC}"

    # Install backend dependencies
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    cd "$BACKEND_DIR"
    if [ ! -d "node_modules" ]; then
        npm install
    else
        echo -e "${GREEN}✓ Backend dependencies already installed${NC}"
    fi

    # Install frontend dependencies
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    cd "$FRONTEND_DIR"
    if [ ! -d "node_modules" ]; then
        npm install
    else
        echo -e "${GREEN}✓ Frontend dependencies already installed${NC}"
    fi

    return 0
}

# Function to seed the database
seed_database() {
    echo -e "${YELLOW}Do you want to seed the database with sample data? (y/n)${NC}"
    read -r response

    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo -e "${YELLOW}Seeding database...${NC}"
        cd "$BACKEND_DIR"
        npm run seed
        echo -e "${GREEN}✓ Database seeded with sample data${NC}"
        echo ""
        echo -e "${GREEN}Test accounts created:${NC}"
        echo "  Buyer: jane@example.com / password123"
        echo "  Seller: techdeals@example.com / password123"
    fi
}

# Function to start the application
start_application() {
    echo ""
    echo -e "${GREEN}Starting eBay Clone...${NC}"
    echo ""

    # Start backend
    echo -e "${YELLOW}Starting backend server on port $BACKEND_PORT...${NC}"
    cd "$BACKEND_DIR"
    PORT=$BACKEND_PORT npm start &
    BACKEND_PID=$!

    # Wait for backend to start
    sleep 3

    # Start frontend
    echo -e "${YELLOW}Starting frontend on port $FRONTEND_PORT...${NC}"
    cd "$FRONTEND_DIR"
    PORT=$FRONTEND_PORT npm start &
    FRONTEND_PID=$!

    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                           ║${NC}"
    echo -e "${GREEN}║   eBay Clone is starting!                                 ║${NC}"
    echo -e "${GREEN}║                                                           ║${NC}"
    echo -e "${GREEN}║   Frontend: http://localhost:$FRONTEND_PORT                         ║${NC}"
    echo -e "${GREEN}║   Backend:  http://localhost:$BACKEND_PORT                         ║${NC}"
    echo -e "${GREEN}║   API Docs: http://localhost:$BACKEND_PORT/api/health              ║${NC}"
    echo -e "${GREEN}║                                                           ║${NC}"
    echo -e "${GREEN}║   Press Ctrl+C to stop                                    ║${NC}"
    echo -e "${GREEN}║                                                           ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""

    # Handle cleanup on exit
    trap cleanup EXIT INT TERM

    # Wait for processes
    wait
}

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    echo -e "${GREEN}Goodbye!${NC}"
}

# Main execution
main() {
    # Clean up ports first
    clean_ports

    # Check PostgreSQL
    if ! check_postgres; then
        exit 1
    fi

    # Setup database
    if ! setup_database; then
        exit 1
    fi

    # Install dependencies
    if ! install_dependencies; then
        exit 1
    fi

    # Check if database needs seeding (check if users table has data)
    USERS_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0")

    if [ "$USERS_COUNT" = "0" ] || [ -z "$USERS_COUNT" ]; then
        echo -e "${YELLOW}Database appears to be empty.${NC}"
        seed_database
    fi

    # Start the application
    start_application
}

# Run main function
main "$@"
