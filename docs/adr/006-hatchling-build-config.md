# ADR 006: Hatchling Build Configuration for Non-Standard Package Layout

**Status:** Accepted
**Date:** 2026-03-10
**Author:** Agnij Dutta

## Context

Our Python backend uses [Hatchling](https://hatch.pypa.io/) as the build backend (via `pyproject.toml`). The project name in `pyproject.toml` is `cerberus`, but the actual source code lives in the `app/` directory — not a `cerberus/` directory.

Hatchling's default package discovery looks for a directory matching the project name. When it can't find `cerberus/`, it fails:

```
ValueError: Unable to determine which files to ship inside the wheel
using the following heuristics:
The most likely cause of this is that there is no directory that
matches the name of your project (cerberus).
```

This broke the production Docker build. The multi-stage Dockerfile runs `pip install --prefix=/install .` in the builder stage, which triggers Hatchling's wheel build — and it fails before any application code is packaged.

## Decision

Explicitly configure Hatchling's wheel target to package the `app/` directory:

```toml
[tool.hatch.build.targets.wheel]
packages = ["app"]
```

We chose to keep the project name as `cerberus` (for PyPI-style identification and metadata) while the source lives in `app/` (following FastAPI's conventional project structure).

## Alternatives Considered

1. **Rename `app/` to `cerberus/`** — Would fix the heuristic but break every import (`from app.config import ...` → `from cerberus.config import ...`) across 50+ files and all test files. High blast radius for a config issue.

2. **Use `src/` layout with `cerberus/` inside** — Standard Python packaging layout, but an even larger refactor. Not worth it for a web application that's never published to PyPI.

3. **Switch to setuptools** — Would also need explicit package config. No advantage over Hatchling.

## Consequences

### Good

- One line of config fixes the Docker build
- Source directory stays as `app/` — consistent with FastAPI conventions and every tutorial/example out there
- Project name stays as `cerberus` for metadata purposes

### Bad

- Easy to forget this config exists. If someone refactors the directory structure, they need to update this too. But that's true of any build config.
