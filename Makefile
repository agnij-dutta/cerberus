.PHONY: dev test lint build clean migrate seed load-test stop logs help

# Default target
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

# ---------------------------------------------------------------------------
# Development
# ---------------------------------------------------------------------------

dev: ## Start the full development stack
	cd infra && docker compose up -d
	@echo ""
	@echo "Cerberus is running:"
	@echo "  Backend:    http://localhost:8000"
	@echo "  Frontend:   http://localhost:3000"
	@echo "  Grafana:    http://localhost:3001  (admin / cerberus)"
	@echo "  Prometheus: http://localhost:9090"
	@echo ""

stop: ## Stop all services
	cd infra && docker compose down

logs: ## Tail logs from all services
	cd infra && docker compose logs -f

logs-backend: ## Tail backend logs only
	cd infra && docker compose logs -f backend

# ---------------------------------------------------------------------------
# Testing
# ---------------------------------------------------------------------------

test: ## Run all tests
	cd backend && python -m pytest -v

test-unit: ## Run unit tests only (no external deps)
	cd backend && python -m pytest -v -m unit

test-integration: ## Run integration tests (requires Redis)
	cd backend && python -m pytest -v -m integration

test-coverage: ## Run tests with coverage report
	cd backend && python -m pytest --cov=app --cov-report=html --cov-report=term-missing

# ---------------------------------------------------------------------------
# Code Quality
# ---------------------------------------------------------------------------

lint: ## Run linters (ruff + mypy)
	cd backend && python -m ruff check .
	cd backend && python -m ruff format --check .
	cd backend && python -m mypy app/

lint-fix: ## Auto-fix lint issues
	cd backend && python -m ruff check --fix .
	cd backend && python -m ruff format .

# ---------------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------------

build: ## Build all Docker images
	cd infra && docker compose build

build-backend: ## Build backend image only
	cd backend && docker build -t cerberus-backend .

build-frontend: ## Build frontend image only
	cd frontend && docker build -t cerberus-frontend .

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------

migrate: ## Run database migrations
	cd backend && python -m alembic upgrade head

migrate-create: ## Create a new migration (usage: make migrate-create MSG="add foo table")
	cd backend && python -m alembic revision --autogenerate -m "$(MSG)"

migrate-rollback: ## Rollback last migration
	cd backend && python -m alembic downgrade -1

# ---------------------------------------------------------------------------
# Data
# ---------------------------------------------------------------------------

seed: ## Seed demo tenant and sample policies
	bash infra/scripts/seed-data.sh

# ---------------------------------------------------------------------------
# Performance
# ---------------------------------------------------------------------------

load-test: ## Run load tests with Locust
	cd backend && python -m locust -f tests/load/locustfile.py \
		--host=http://localhost:8000 \
		--users=100 \
		--spawn-rate=10 \
		--run-time=60s \
		--headless

# ---------------------------------------------------------------------------
# Cleanup
# ---------------------------------------------------------------------------

clean: ## Remove all containers, volumes, and build artifacts
	cd infra && docker compose down -v --remove-orphans
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .mypy_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .ruff_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name htmlcov -exec rm -rf {} + 2>/dev/null || true
	find . -name "*.pyc" -delete 2>/dev/null || true
	rm -rf backend/dist backend/*.egg-info
	rm -rf sdk/typescript/dist
	@echo "Clean."
