.PHONY: dev install build lint clean stop help

# Default target
help:
	@echo "Available commands:"
	@echo "  make dev       - Start both backend and frontend in development mode"
	@echo "  make install   - Install dependencies for both projects"
	@echo "  make build     - Build both projects"
	@echo "  make lint      - Run linting for both projects"
	@echo "  make clean     - Clean node_modules and build artifacts"
	@echo "  make stop      - Stop all running servers"

# Start both servers in development mode
dev:
	@echo "Starting backend and frontend..."
	@make -j2 dev-backend dev-frontend

# Start individual servers (used by dev target)
dev-backend:
	@cd finance-flow-backend && npm run dev

dev-frontend:
	@cd finance-flow-frontend && npm run dev

# Install dependencies for both projects
install:
	@echo "Installing backend dependencies..."
	@cd finance-flow-backend && npm install
	@echo "Installing frontend dependencies..."
	@cd finance-flow-frontend && npm install

# Build both projects
build:
	@echo "Building backend..."
	@cd finance-flow-backend && npm run build
	@echo "Building frontend..."
	@cd finance-flow-frontend && npm run build

# Run linting for both projects
lint:
	@echo "Linting backend..."
	@cd finance-flow-backend && npm run lint
	@echo "Linting frontend..."
	@cd finance-flow-frontend && npm run lint

# Clean all node_modules and build artifacts
clean:
	@echo "Cleaning backend..."
	@cd finance-flow-backend && rm -rf node_modules dist
	@echo "Cleaning frontend..."
	@cd finance-flow-frontend && rm -rf node_modules dist
	@echo "Cleaning root..."
	@rm -rf node_modules

# Stop finance-flow servers only
stop:
	@echo "Stopping finance-flow servers..."
	@pkill -f "finance-flow-backend.*npm run dev" || true
	@pkill -f "finance-flow-frontend.*npm run dev" || true
	@pkill -f "nodemon.*finance-flow-backend" || true
	@pkill -f "vite.*finance-flow-frontend" || true
	@lsof -ti:3001 | xargs kill -9 2>/dev/null || true
	@lsof -ti:5173 | xargs kill -9 2>/dev/null || true
	@echo "Finance-flow servers stopped."