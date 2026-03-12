# cerberus-sdk

Python SDK for [Cerberus](https://github.com/agnij-dutta/cerberus) — rate limiting infrastructure for modern APIs.

## Installation

```bash
pip install cerberus-sdk
```

## Quick Start

```python
from cerberus import CerberusClient

client = CerberusClient(
    base_url="https://api.cerberus.dev",
    api_key="cerb_your_api_key",
)

# Check a rate limit
result = client.check("user:42", "api-default")

if result.allowed:
    print(f"OK — {result.remaining}/{result.limit} remaining")
else:
    print(f"Rate limited. Retry after {result.retry_after}s")
```

## API

### `CerberusClient(base_url, api_key, timeout=5.0)`

| Parameter | Type | Description |
|-----------|------|-------------|
| `base_url` | `str` | Cerberus API URL |
| `api_key` | `str` | Your tenant API key |
| `timeout` | `float` | Request timeout in seconds |

### `client.check(key, policy, cost=1) -> CheckResult`

Check a rate limit for a given key against a policy.

| Field | Type | Description |
|-------|------|-------------|
| `allowed` | `bool` | Whether the request is allowed |
| `remaining` | `int` | Requests remaining in window |
| `limit` | `int` | Total requests allowed per window |
| `reset` | `int` | Unix timestamp when window resets |
| `retry_after` | `float \| None` | Seconds to wait (if rate limited) |

### `client.create_policy(name, limit, window_seconds, algorithm="sliding_window")`
### `client.list_policies() -> list[Policy]`
### `client.delete_policy(policy_id)`

## Context Manager

```python
with CerberusClient(base_url="...", api_key="...") as client:
    result = client.check("user:42", "default")
```

## Framework Middleware

- **FastAPI**: [`cerberus-fastapi`](https://pypi.org/project/cerberus-fastapi/)
- **Express**: [`cerberus-express`](https://www.npmjs.com/package/cerberus-express)

## License

MIT
