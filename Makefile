# Makefile for AI Image Generator
# Run from project root

# Variables
PAGES_DIR = pages-app
PROJECT_NAME = ai-image-generator-auth
PAGES_PROJECT_NAME = ai-image-generator-frontend

# Colors
GREEN = \033[0;32m
YELLOW = \033[0;33m
RED = \033[0;31m
NC = \033[0m

# Default target
.PHONY: help
help:
	@echo "$(GREEN)AI Image Generator - Available Commands$(NC)"
	@echo ""
	@echo "$(YELLOW)Setup:$(NC)"
	@echo "  make install      - Install all dependencies"
	@echo "  make setup        - Complete initial setup (resources + dependencies)"
	@echo ""
	@echo "$(YELLOW)Development:$(NC)"
	@echo "  make dev          - Run both worker and frontend in development"
	@echo "  make dev-worker   - Run worker only (port 8787)"
	@echo "  make dev-frontend - Run frontend only (port 5173)"
	@echo ""
	@echo "$(YELLOW)Build & Deploy:$(NC)"
	@echo "  make build        - Build frontend for production"
	@echo "  make deploy       - Deploy both worker and frontend"
	@echo "  make deploy-worker - Deploy worker only"
	@echo "  make deploy-pages - Deploy frontend to Cloudflare Pages"
	@echo ""
	@echo "$(YELLOW)Database:$(NC)"
	@echo "  make db-init      - Initialize database schema"
	@echo "  make db-reset     - Reset database (WARNING: deletes all data)"
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

# Complete setup
.PHONY: setup
setup:
	@echo "$(GREEN)Starting complete setup...$(NC)"
	@echo "$(YELLOW)Please have your Cloudflare account ready$(NC)"
	@make install
	@echo ""
	@echo "$(YELLOW)Next steps:$(NC)"
	@echo "1. Create D1 database: npx wrangler d1 create image-metadata-auth"
	@echo "2. Create R2 bucket: npx wrangler r2 bucket create ai-generated-images-auth"
	@echo "3. Create KV namespace: npx wrangler kv namespace create sessions"
	@echo "4. Update wrangler.toml with the IDs from above commands"
	@echo "5. Run: make db-init"
	@echo "6. Set JWT secret: npx wrangler secret put JWT_SECRET"

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

# Build frontend
.PHONY: build
build:
	@echo "$(GREEN)Building frontend for production...$(NC)"
	cd $(PAGES_DIR) && npm run build
	@echo "$(GREEN)✓ Build complete$(NC)"

# Deploy everything
.PHONY: deploy
deploy:
	@echo "$(GREEN)Deploying worker and frontend...$(NC)"
	@make deploy-worker
	@make build
	@make deploy-pages
	@echo "$(GREEN)✓ Deployment complete$(NC)"

# Deploy worker only
.PHONY: deploy-worker
deploy-worker:
	@echo "$(GREEN)Deploying worker to Cloudflare...$(NC)"
	npx wrangler deploy
	@echo "$(GREEN)✓ Worker deployed$(NC)"

.PHONY: init-pages
init-pages:
	@echo "$(GREEN)Initializing frontend build directory...$(NC)"
	cd $(PAGES_DIR) && npm install && npm run build
	@echo "$(GREEN)✓ Frontend built and ready for deployment$(NC)"

# Deploy frontend to Pages
.PHONY: deploy-pages
deploy-pages:
	@echo "$(GREEN)Deploying frontend to Cloudflare Pages...$(NC)"
	cd $(PAGES_DIR) && npx wrangler pages deploy dist --project-name=$(PAGES_PROJECT_NAME)
	@echo "$(GREEN)✓ Frontend deployed to Pages$(NC)"

# Database initialization
.PHONY: db-init
db-init:
	@echo "$(GREEN)Initializing database schema...$(NC)"
	npx wrangler d1 execute image-metadata-auth --remote --file=./schema.sql
	@echo "$(GREEN)✓ Database initialized$(NC)"

# Database reset
.PHONY: db-reset
db-reset:
	@echo "$(RED)⚠️  WARNING: This will delete all data!$(NC)"
	@read -p "Are you sure you want to reset the database? [y/N] " -n 1 -r; \
	echo ""; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		echo "$(GREEN)Resetting database...$(NC)"; \
		npx wrangler d1 execute image-metadata-auth --command="DROP TABLE IF EXISTS images; DROP TABLE IF EXISTS user_rate_limits; DROP TABLE IF EXISTS sessions; DROP TABLE IF EXISTS users;" && \
		make db-init; \
	else \
		echo "$(YELLOW)Database reset cancelled$(NC)"; \
	fi

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

# Secret management helper
.PHONY: secrets
secrets:
	@echo "$(GREEN)Setting up secrets...$(NC)"
	@echo "$(YELLOW)Setting JWT_SECRET...$(NC)"
	@npx wrangler secret put JWT_SECRET
	@echo "$(GREEN)✓ Secrets configured$(NC)"