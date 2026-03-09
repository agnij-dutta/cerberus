# Contributing to Cerberus

Hey, thanks for considering a contribution. We appreciate it.

## Ground Rules

- Be respectful. We're all here to build something useful.
- Open an issue before starting large changes. Let's talk about it first so nobody wastes time.
- Write tests for new features. We maintain >80% coverage and we'd like to keep it that way.
- Follow the existing code style. We use `ruff` for Python and `eslint` + `prettier` for TypeScript. Run the linters before pushing.

## Development Setup

1. Fork and clone:
```bash
git clone https://github.com/your-username/cerberus.git
cd cerberus
```

2. Start the dev stack:
```bash
make dev
```

3. Run tests:
```bash
make test
```

4. Run linters:
```bash
make lint
```

## Project Structure

```
cerberus/
├── backend/          # FastAPI application
│   ├── app/          # Source code
│   └── tests/        # Test suite
├── frontend/         # Next.js dashboard
├── infra/            # Docker, Nginx, Prometheus, etc.
├── sdk/              # Client SDKs (Python, TypeScript)
└── docs/             # Documentation
```

## Making Changes

### Backend (Python)

The backend lives in `backend/app/`. Key areas:

- `app/api/` — API route handlers
- `app/core/` — Rate limiting algorithms, Redis operations
- `app/db/` — Database models and queries
- `app/models/` — Pydantic schemas

We use:
- **Python 3.11+**
- **FastAPI** for the web framework
- **SQLAlchemy 2.0** (async) for the ORM
- **redis-py** with hiredis for Redis
- **pytest** with `pytest-asyncio` for testing

### Frontend (TypeScript)

- **Next.js** with App Router
- **TypeScript** strict mode
- Standard Next.js project structure

### Tests

```bash
# All tests
make test

# Just unit tests (fast, no external deps)
pytest -m unit

# Integration tests (needs Redis)
pytest -m integration

# With coverage
pytest --cov=app --cov-report=html
```

## Pull Request Process

1. Create a feature branch: `git checkout -b feat/my-feature`
2. Make your changes with tests
3. Run `make lint && make test` — both must pass
4. Push and open a PR against `main`
5. Fill out the PR template
6. Wait for review — we try to get to PRs within a few days

### PR Title Convention

We use conventional commits for PR titles:

- `feat: add token bucket algorithm`
- `fix: correct sliding window edge case at midnight`
- `docs: update API reference for /check endpoint`
- `refactor: extract policy cache into separate module`
- `test: add integration tests for multi-tenant isolation`
- `chore: update dependencies`

### What We Look For in Reviews

- Does it work? Does it have tests?
- Is the code readable? Would a new contributor understand it?
- Does it handle errors gracefully?
- Is it performant? Rate limiting is on the hot path — every microsecond counts.
- Does it follow existing patterns?

## Reporting Bugs

Open an issue with:
- What you expected to happen
- What actually happened
- Steps to reproduce
- Your environment (OS, Docker version, etc.)

## Feature Requests

Open an issue with the `enhancement` label. Tell us:
- What problem you're trying to solve
- How you'd like it to work
- Any alternatives you've considered

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
