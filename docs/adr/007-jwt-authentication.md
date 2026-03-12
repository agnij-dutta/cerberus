# ADR 007: JWT Authentication Alongside API Keys

**Status:** Accepted
**Date:** 2026-03-12
**Author:** Agnij Dutta

## Context

Cerberus originally supported only API key authentication (`X-API-Key` header with SHA-256 hash lookup). This works well for machine-to-machine SDK usage but creates friction for the web dashboard:

1. Users had to copy-paste a 48-character hex key to log in — poor UX for a browser-based dashboard.
2. No way to do email/password signup — tenants were created via admin API or direct database insertion.
3. The API key is a long-lived secret. Using it for browser sessions (stored in localStorage) increases exposure risk.

The dashboard needed a human-friendly auth flow (email + password) while keeping API keys for SDK/programmatic access.

## Decision

Add JWT-based authentication as a **parallel** auth mechanism. Both methods coexist:

| Auth Method | Use Case | Header | Lifetime |
|-------------|----------|--------|----------|
| API Key | SDKs, programmatic access | `X-API-Key: cerb_...` | Permanent (until rotated) |
| JWT | Dashboard, browser sessions | `Authorization: Bearer <token>` | 60 minutes (configurable) |

### New Endpoints

- `POST /v1/auth/signup` — email + password + name → JWT + API key (shown once)
- `POST /v1/auth/login` — email + password → JWT
- `GET /v1/auth/me` — JWT required → tenant profile

### Database Changes

Two nullable columns added to `tenants`:
- `email` (String(320), unique, indexed)
- `password_hash` (Text, bcrypt)

Nullable because existing tenants created via admin API may not have email/password.

### Implementation

- **PyJWT** for token creation/verification
- **Passlib + bcrypt** for password hashing
- **email-validator** for signup validation
- JWT secret via `CERBERUS_JWT_SECRET_KEY` env var
- `get_current_tenant_from_jwt()` FastAPI dependency

## Alternatives Considered

1. **Replace API keys with JWT entirely** — Would break existing SDK integrations and require token refresh logic in every SDK. API keys are simpler for M2M.

2. **OAuth2 / OIDC** — Overkill for a single-service application. No need for third-party identity providers at this stage.

3. **Session cookies** — Would work for the dashboard but adds CSRF concerns and doesn't play well with the API proxy architecture (Vercel → Render).

## Consequences

### Good

- Dashboard has a proper signup/login flow with email + password
- API keys remain the primary auth for SDKs — no breaking changes
- JWT is stateless — no session store needed, works naturally with the existing stateless backend architecture
- Migration is additive (nullable columns) — zero risk to existing tenants

### Bad

- Two auth code paths to maintain (API key dependency + JWT dependency)
- JWT secret must be configured as an environment variable on all deployments
- No token refresh mechanism yet — users get logged out after 60 minutes
