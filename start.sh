#!/bin/bash

# eBay Clone - Start Script
# This script starts the application with hot reload, seeds data, and cleans ports

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Project directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
DATABASE_DIR="$SCRIPT_DIR/database"
ROOT_ENV="$SCRIPT_DIR/.env"

# Load environment variables from root .env
if [ -f "$ROOT_ENV" ]; then
    echo -e "${CYAN}Loading environment from root .env file...${NC}"
    set -a
    source "$ROOT_ENV"
    set +a
else
    echo -e "${RED}Error: Root .env file not found at $ROOT_ENV${NC}"
    echo -e "${YELLOW}Please create .env file with required configuration${NC}"
    exit 1
fi

# Application ports (from .env or defaults, never use 5000)
BACKEND_PORT="${BACKEND_PORT:-4000}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

# Ensure we don't use port 5000
if [ "$BACKEND_PORT" = "5000" ]; then
    BACKEND_PORT=4000
fi
if [ "$FRONTEND_PORT" = "5000" ]; then
    FRONTEND_PORT=3000
fi

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║                                                                    ║"
echo "║                         eBay Clone                                 ║"
echo "║                  Professional Marketplace                          ║"
echo "║                                                                    ║"
echo "║   Features: AI-Powered • Hot Reload • PostgreSQL • OpenRouter     ║"
echo "║                                                                    ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
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

# Function to clean up ALL potentially used ports
clean_all_ports() {
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Cleaning up all used ports...${NC}"
    kill_port $FRONTEND_PORT
    kill_port $BACKEND_PORT
    kill_port 5000  # Always clean 5000 just in case
    kill_port 5001
    kill_port 8080
    echo -e "${GREEN}✓ All ports cleaned${NC}"
    echo ""
}

# Function to check if PostgreSQL is running
check_postgres() {
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Checking PostgreSQL connection...${NC}"

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
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
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

# Function to run database schema
run_schema() {
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Running database schema and migrations...${NC}"

    if [ -f "$DATABASE_DIR/schema.sql" ]; then
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$DATABASE_DIR/schema.sql" 2>/dev/null || true
        echo -e "${GREEN}✓ Schema applied${NC}"
    fi

    if [ -f "$DATABASE_DIR/schema_additions.sql" ]; then
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$DATABASE_DIR/schema_additions.sql" 2>/dev/null || true
        echo -e "${GREEN}✓ Schema additions applied${NC}"
    fi

    # Run all migrations
    for migration in "$DATABASE_DIR/migrations"/*.sql; do
        if [ -f "$migration" ]; then
            PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration" 2>/dev/null || true
            echo -e "${GREEN}✓ Migration applied: $(basename $migration)${NC}"
        fi
    done
}

# Function to seed ALL data automatically
seed_all_data() {
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Seeding database with comprehensive data (15+ items per feature)...${NC}"

    # Run the comprehensive seed file
    if [ -f "$DATABASE_DIR/seed_complete.sql" ]; then
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$DATABASE_DIR/seed_complete.sql" 2>/dev/null || true
        echo -e "${GREEN}✓ Complete seed data loaded${NC}"
    fi

    # Run security features seed
    if [ -f "$DATABASE_DIR/seed_security_features.sql" ]; then
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$DATABASE_DIR/seed_security_features.sql" 2>/dev/null || true
        echo -e "${GREEN}✓ Security features seed data loaded${NC}"
    fi

    # Fill every feature table to >=15 rows (idempotent)
    if [ -f "$DATABASE_DIR/seed_fill_features.sql" ]; then
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$DATABASE_DIR/seed_fill_features.sql" 2>/dev/null || true
        echo -e "${GREEN}✓ Feature fill seed data loaded${NC}"
    fi

    # Fill per-user feature rows to >=15 for EVERY user so every login shows data
    if [ -f "$DATABASE_DIR/seed_per_user_all.sql" ]; then
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$DATABASE_DIR/seed_per_user_all.sql" 2>/dev/null || true
        echo -e "${GREEN}✓ Per-user feature data loaded (all 20 users)${NC}"
    fi

    # Per-user GAP fill: tables the main per-user seed missed (analytics,
    # logs, A/B tests, live chat, payments, etc.) — 15+ rows per user.
    if [ -f "$DATABASE_DIR/seed_per_user_gaps.sql" ]; then
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$DATABASE_DIR/seed_per_user_gaps.sql" 2>/dev/null || true
        echo -e "${GREEN}✓ Per-user gap-fill data loaded${NC}"
    fi

    # Seller Performance dashboard: 15+ defects, 15+ months of orders, tracking,
    # and a refreshed seller_performance row per seller.
    if [ -f "$DATABASE_DIR/seed_seller_performance.sql" ]; then
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$DATABASE_DIR/seed_seller_performance.sql" 2>/dev/null || true
        echo -e "${GREEN}✓ Seller performance data loaded (every seller)${NC}"
    fi

    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}Test Accounts Created:${NC}"
    echo -e "${CYAN}  Buyer:  ${NC}buyer@ebay.com / password123"
    echo -e "${CYAN}  Seller: ${NC}seller@ebay.com / password123"
    echo -e "${CYAN}  Admin:  ${NC}admin@ebay.com / password123"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Function to check and install Node.js dependencies
install_dependencies() {
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
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
    if [ ! -d "node_modules" ] || [ "$1" = "--fresh" ]; then
        npm install
        # Install nodemon for hot reload
        npm install --save-dev nodemon 2>/dev/null || true
    else
        echo -e "${GREEN}✓ Backend dependencies already installed${NC}"
    fi

    # Install frontend dependencies
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    cd "$FRONTEND_DIR"
    if [ ! -d "node_modules" ] || [ "$1" = "--fresh" ]; then
        npm install
    else
        echo -e "${GREEN}✓ Frontend dependencies already installed${NC}"
    fi

    return 0
}

# Function to copy .env to subdirectories for compatibility
setup_env_files() {
    echo -e "${YELLOW}Setting up environment files...${NC}"

    # Create symlinks or copies for backend and frontend
    cp "$ROOT_ENV" "$BACKEND_DIR/.env" 2>/dev/null || true

    # Create frontend .env with REACT_APP_ prefixed variables
    cat > "$FRONTEND_DIR/.env" << EOF
REACT_APP_API_URL=http://localhost:$BACKEND_PORT/api
REACT_APP_STRIPE_PUBLISHABLE_KEY=$STRIPE_PUBLISHABLE_KEY
REACT_APP_APP_NAME=eBay Clone
EOF

    echo -e "${GREEN}✓ Environment files configured${NC}"
}

# Function to start the application with hot reload
start_application() {
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}Starting eBay Clone with Hot Reload...${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    # Start backend with nodemon for hot reload
    echo -e "${YELLOW}Starting backend server with hot reload on port $BACKEND_PORT...${NC}"
    cd "$BACKEND_DIR"

    # Check if nodemon is available, otherwise use node with watch
    if command_exists npx && [ -f "node_modules/.bin/nodemon" ]; then
        PORT=$BACKEND_PORT npx nodemon --watch src --ext js,json src/index.js &
    else
        # Fallback to node with --watch flag (Node 18+)
        PORT=$BACKEND_PORT node --watch src/index.js 2>/dev/null &
        if [ $? -ne 0 ]; then
            PORT=$BACKEND_PORT node src/index.js &
        fi
    fi
    BACKEND_PID=$!

    # Wait for backend to start
    sleep 3

    # Start frontend with hot reload (React's default behavior)
    echo -e "${YELLOW}Starting frontend with hot reload on port $FRONTEND_PORT...${NC}"
    cd "$FRONTEND_DIR"
    PORT=$FRONTEND_PORT BROWSER=none npm start &
    FRONTEND_PID=$!

    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                                    ║${NC}"
    echo -e "${GREEN}║   eBay Clone is running with HOT RELOAD!                          ║${NC}"
    echo -e "${GREEN}║                                                                    ║${NC}"
    echo -e "${GREEN}║   Frontend:  ${CYAN}http://localhost:$FRONTEND_PORT${GREEN}                              ║${NC}"
    echo -e "${GREEN}║   Backend:   ${CYAN}http://localhost:$BACKEND_PORT${GREEN}                              ║${NC}"
    echo -e "${GREEN}║   API:       ${CYAN}http://localhost:$BACKEND_PORT/api${GREEN}                          ║${NC}"
    echo -e "${GREEN}║                                                                    ║${NC}"
    echo -e "${GREEN}║   ${YELLOW}Code changes will automatically reload!${GREEN}                        ║${NC}"
    echo -e "${GREEN}║                                                                    ║${NC}"
    echo -e "${GREEN}║   Press ${RED}Ctrl+C${GREEN} to stop                                            ║${NC}"
    echo -e "${GREEN}║                                                                    ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    # Handle cleanup on exit
    trap cleanup EXIT INT TERM

    # Wait for processes
    wait
}

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down eBay Clone...${NC}"

    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi

    # Clean up ports
    kill_port $BACKEND_PORT 2>/dev/null || true
    kill_port $FRONTEND_PORT 2>/dev/null || true

    echo -e "${GREEN}Goodbye! Thank you for using eBay Clone.${NC}"
}

# Main execution
main() {
    # Clean up ALL ports first
    clean_all_ports

    # Check PostgreSQL
    if ! check_postgres; then
        exit 1
    fi

    # Setup database
    if ! setup_database; then
        exit 1
    fi

    # Run schema
    run_schema

    # Install dependencies
    if ! install_dependencies "$1"; then
        exit 1
    fi

    # Setup environment files for subdirectories
    setup_env_files

    # Check if database needs seeding (auto-seed without prompting)
    USERS_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0")

    if [ "$USERS_COUNT" = "0" ] || [ -z "$USERS_COUNT" ] || [ "$1" = "--reseed" ]; then
        seed_all_data
    else
        echo -e "${GREEN}✓ Database already has $USERS_COUNT users${NC}"
    fi

    # Start the application
    start_application
}

# Run main function
main "$@"
