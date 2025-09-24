# Makefile for Immerse Seoul
# Run from project root

# Variables
PAGES_DIR = pages-app

# Colors
GREEN = \033[0;32m
YELLOW = \033[0;33m
RED = \033[0;31m
NC = \033[0m

# Default target
.PHONY: help
help:
	@echo "$(GREEN)Immerse Seoul - Available Commands$(NC)"
	@echo ""
	@echo "$(YELLOW)Setup:$(NC)"
	@echo "  make install      - Install all dependencies"
	@echo ""
	@echo "$(YELLOW)Development:$(NC)"
	@echo "  make dev          - Run both worker and frontend"
	@echo "  make dev-worker   - Run worker only (port 8787)"
	@echo "  make dev-frontend - Run frontend only (port 5173)"
	@echo ""
	@echo "$(YELLOW)Deploy:$(NC)"
	@echo "  make deploy       - Build frontend and deploy both Workers"
	@echo "  make deploy-backend - Deploy backend Worker only"
	@echo "  make deploy-frontend - Deploy frontend Worker only"
	@echo "  make build-frontend - Build frontend assets only"
	@echo ""
	@echo "$(YELLOW)Database:$(NC)"
	@echo "  make db-init      - Initialize database schema"
	@echo ""
	@echo "$(YELLOW)Utilities:$(NC)"
	@echo "  make logs         - Tail worker logs"
	@echo "  make clean        - Clean build artifacts"

# Install all dependencies
.PHONY: install
install:
	@echo "$(GREEN)Installing worker dependencies...$(NC)"
	npm install
	@echo "$(GREEN)Installing frontend dependencies...$(NC)"
	cd $(PAGES_DIR) && npm install
	@echo "$(GREEN)✓ All dependencies installed$(NC)"


# Development - run both services
.PHONY: dev
dev:
	@echo "$(GREEN)Starting development servers...$(NC)"
	@echo "$(YELLOW)Worker: http://localhost:8787$(NC)"
	@echo "$(YELLOW)Frontend: http://localhost:5173$(NC)"
	@make -j 2 dev-worker dev-frontend

# Development - worker only
.PHONY: dev-worker
dev-worker:
	@echo "$(GREEN)Starting Worker dev server on port 8787...$(NC)"
	npx wrangler dev

# Development - frontend only
.PHONY: dev-frontend
dev-frontend:
	@echo "$(GREEN)Starting Frontend dev server on port 5173...$(NC)"
	cd $(PAGES_DIR) && npm run dev


# Deploy everything (build frontend + deploy both workers)
.PHONY: deploy
deploy:
	@echo "$(GREEN)Building frontend and deploying both Workers...$(NC)"
	@make build-frontend
	@make deploy-backend
	@make deploy-frontend
	@echo "$(GREEN)✓ Deployment complete$(NC)"

# Deploy backend worker only
.PHONY: deploy-backend
deploy-backend:
	@echo "$(GREEN)Deploying backend Worker to Cloudflare...$(NC)"
	npx wrangler deploy --config wrangler.local.jsonc
	@echo "$(GREEN)✓ Backend Worker deployed$(NC)"

# Deploy frontend worker only
.PHONY: deploy-frontend
deploy-frontend:
	@echo "$(GREEN)Deploying frontend Worker to Cloudflare...$(NC)"
	cd $(PAGES_DIR) && npx wrangler deploy
	@echo "$(GREEN)✓ Frontend Worker deployed$(NC)"


# Build frontend assets
.PHONY: build-frontend
build-frontend:
	@echo "$(GREEN)Building frontend assets...$(NC)"
	cd $(PAGES_DIR) && npm run build
	@echo "$(GREEN)Copying .assetsignore to dist directory...$(NC)"
	cp $(PAGES_DIR)/.assetsignore $(PAGES_DIR)/dist/.assetsignore 2>/dev/null || true
	@echo "$(GREEN)✓ Frontend built$(NC)"


# Database initialization
.PHONY: db-init
db-init:
	@echo "$(GREEN)Initializing database schema...$(NC)"
	npx wrangler d1 execute image-metadata-auth --remote --file=./schema.sql
	@echo "$(GREEN)✓ Database initialized$(NC)"


# View logs
.PHONY: logs
logs:
	@echo "$(GREEN)Tailing worker logs...$(NC)"
	npx wrangler tail

# Clean build artifacts
.PHONY: clean
clean:
	@echo "$(GREEN)Cleaning build artifacts...$(NC)"
	rm -rf $(PAGES_DIR)/dist
	@echo "$(GREEN)✓ Clean complete$(NC)"
