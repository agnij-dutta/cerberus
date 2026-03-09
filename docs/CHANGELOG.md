# Changelog

All notable changes to Cerberus are documented here.

## [1.0.0] — 2026-03-10

### Initial Release

Production-grade Rate-Limit-as-a-Service. Built from scratch, battle-tested through deployment.

### Added

**Backend**
- FastAPI application with async SQLAlchemy (asyncpg) and Pydantic v2
- Three rate limiting algorithms: sliding window (Redis sorted sets), token bucket (Redis hashes), fixed window (Redis strings)
- Atomic Lua scripts for all rate limit operations — single Redis round trip per check
- Multi-tenant architecture with isolated namespaces and per-tenant API keys
- SHA-256 hashed API key storage with prefix-based lookup
- 3-tier caching: in-process LRU → Redis hash → PostgreSQL
- Prometheus metrics with custom counters and latency histograms
- RFC 7807 Problem Details error responses
- Structured JSON logging via structlog
- Health endpoints: `/healthz` (liveness), `/readyz` (readiness with dependency checks)
- Full CRUD for policies and tenants
- Analytics endpoint with daily usage aggregation
- Admin API key authentication for tenant management
- Gunicorn + Uvicorn worker configuration for production

**Frontend**
- Next.js 15 with App Router, TypeScript, Tailwind CSS
- Marketing landing page with hero, features grid, pricing, animated code demos
- Documentation site with sidebar navigation, code blocks, and quickstart guide
- Admin dashboard with usage charts, policy management, API key management
- Glass-morphism navbar with blur backdrop
- Dark theme by default with light mode support
- Typed API client for all backend endpoints

**Infrastructure**
- Docker Compose dev stack (backend, frontend, Redis, PostgreSQL, Prometheus, Grafana)
- Production Docker Compose overlay with Nginx load balancer, 3 backend replicas
- Multi-stage Dockerfile for optimized backend images
- Pre-built Grafana dashboard with rate limit metrics
- Nginx configuration with upstream load balancing

**SDKs**
- Python SDK (`cerberus-python`) with sync/async support via httpx
- TypeScript SDK (`@cerberus/sdk`) with full type safety

**Testing**
- 47 tests passing: 26 unit, 10 integration, 2 e2e, 9 auth
- fakeredis with Lua support for unit testing without Redis
- pytest-asyncio for async test support
- >80% code coverage target

**CI/CD**
- GitHub Actions workflow with three jobs: backend-lint, backend-test, frontend-build
- Ruff linting with strict rule set (E, F, W, I, N, UP, B, A, SIM, TC)
- ESLint + TypeScript strict mode for frontend

**Deployment**
- Render (backend) with Docker-based deployment
- Vercel (frontend) with API proxy rewrites to Render
- Neon PostgreSQL (serverless, free tier)
- Upstash Redis (serverless, TLS, free tier)
- Cron job (cron-job.org) hitting `/healthz` every 10 minutes to prevent Render free-tier spindown

### Fixed

- **`from __future__ import annotations` incompatibility** — Pydantic v2, SQLAlchemy Mapped types, and FastAPI's Annotated dependencies all require runtime type resolution. `from __future__ import annotations` converts all annotations to strings (PEP 563), breaking `ForwardRef` resolution at runtime. Removed from all schema, model, and endpoint files. Added ruff per-file-ignores for TC001/TC003 rules on affected directories.

- **Hatchling package discovery failure** — Project name `cerberus` in pyproject.toml didn't match source directory `app/`. Hatchling couldn't determine which files to include in the wheel. Fixed by adding `[tool.hatch.build.targets.wheel] packages = ["app"]`.

- **Next.js CVE-2025-66478** — Initial dependency on Next.js 15.1.0 had a known vulnerability. Upgraded to latest patched version.

- **ESLint not configured for CI** — `next lint` prompted for interactive configuration during CI, causing the build to hang. Fixed by creating `eslint.config.mjs` extending `next/core-web-vitals` and `next/typescript`.

- **Navbar type error** — TypeScript narrowing issue where `link.href !== "/"` had no type overlap for string literal types. Resolved by using `link.href.length > 1`.

- **60 ruff lint violations** — Bulk cleanup: unused imports, `Optional[X]` → `X | None`, `class Foo(str, Enum)` → `class Foo(StrEnum)`, type-checking import organization.

- **Exception naming convention** — Renamed all custom exceptions to use `Error` suffix (`RateLimitExceededError`, `PolicyNotFoundError`, etc.) per Python conventions. Updated all references across app and test code.

- **Neon PostgreSQL URL scheme** — Neon provides `postgresql://` URLs but asyncpg requires `postgresql+asyncpg://`. Added automatic URL conversion in session initialization.

- **Upstash Redis TLS** — Upstash uses `rediss://` (with TLS). Ensured redis-py connects with SSL when TLS URLs are detected.

- **Python 3.14 + hatchling editable install conflict** — Development environment on Python 3.14 couldn't do editable installs with hatchling. Worked around by installing dependencies individually.

- **Render Docker build failure** — Multi-stage Dockerfile `pip install --prefix=/install .` failed because hatchling couldn't find the package directory. Root cause was missing `[tool.hatch.build.targets.wheel]` config mapping project name to source directory.
