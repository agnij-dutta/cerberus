# ADR 010: SDK Publish Pipeline via GitHub Actions

**Status:** Accepted
**Date:** 2026-03-12
**Author:** Agnij Dutta

## Context

Four SDK packages need to be published to their respective registries:

| Package | Registry |
|---------|----------|
| `cerberus-sdk` | PyPI |
| `cerberus-fastapi` | PyPI |
| `@cerberus/sdk` | npm |
| `@cerberus/express` | npm |

Publishing must be automated, secure, and reproducible.

## Decision

A single GitHub Actions workflow (`publish-sdks.yml`) handles all four packages. It triggers on:

1. **GitHub Release** — publishes all packages (the normal path)
2. **Manual dispatch** — allows publishing specific packages by name (for hotfixes or selective re-publishes)

### PyPI: OIDC Trusted Publishing

Python packages use [PyPI's trusted publishing](https://docs.pypi.org/trusted-publishers/) via `pypa/gh-action-pypi-publish`. This is the recommended approach:

- No long-lived API tokens stored in GitHub secrets
- Authentication is via GitHub's OIDC identity — PyPI verifies the token came from the expected repository/workflow
- Each package needs a one-time trusted publisher configuration on pypi.org

### npm: Token-Based Auth

npm packages use `NODE_AUTH_TOKEN` (a GitHub secret) with `npm publish --access public`. npm doesn't support OIDC trusted publishing yet, so a granular automation token is the best option.

### Build Verification

Each job runs a full build (`python -m build` or `npm run build`) before publishing. This catches TypeScript compilation errors, missing dependencies, and packaging misconfigurations before they reach the registry.

## Alternatives Considered

1. **Separate workflow per package** — More files to maintain, same logic duplicated. A single workflow with conditional jobs is cleaner.

2. **Monorepo publish tools (Lerna, Changesets)** — Designed for npm-only monorepos. We have a mixed Python/TypeScript setup. The overhead doesn't justify it for four packages.

3. **Manual publishing** — Error-prone, not reproducible. Someone will forget to build before publishing, or publish from a dirty working tree.

4. **PyPI API tokens instead of OIDC** — Works but less secure. Tokens must be rotated manually and stored as secrets. OIDC is strictly better.

## Consequences

### Good

- One-click publishing: create a GitHub release and all packages go out
- PyPI publishing is tokenless — no secrets to rotate
- Manual dispatch allows selective re-publishing
- Build step catches errors before they reach users

### Bad

- npm still requires a long-lived token (`NPM_TOKEN` secret)
- All four packages share a version number implicitly (triggered by the same release). Independent versioning would require tagging per package.
- PyPI trusted publishing requires one-time setup per package on pypi.org
