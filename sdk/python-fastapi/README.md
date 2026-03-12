# cerberus-fastapi

FastAPI middleware for [Cerberus](https://github.com/agnij-dutta/cerberus) Rate-Limit-as-a-Service.

## Installation

```bash
pip install cerberus-fastapi
```

## Quick Start

### Middleware (all routes)

```python
from fastapi import FastAPI
from cerberus_fastapi import CerberusMiddleware

app = FastAPI()
app.add_middleware(
    CerberusMiddleware,
    base_url="https://api.cerberus.dev",
    api_key="cerb_your_api_key",
    policy_id="your-policy-uuid",
)
```

### Decorator (per route)

```python
from fastapi import FastAPI, Request
from cerberus_fastapi.decorators import configure, rate_limit

app = FastAPI()
configure("https://api.cerberus.dev", "cerb_your_api_key")

@app.get("/resource")
@rate_limit("policy-uuid")
async def get_resource(request: Request):
    return {"data": "ok"}
```

### Custom identifier

```python
app.add_middleware(
    CerberusMiddleware,
    base_url="https://api.cerberus.dev",
    api_key="cerb_your_api_key",
    policy_id="your-policy-uuid",
    identifier_fn=lambda req: req.headers.get("Authorization", "anon"),
)
```

### Fail open

Set `fail_open=True` to allow requests through when Cerberus is unreachable:

```python
app.add_middleware(
    CerberusMiddleware,
    base_url="https://api.cerberus.dev",
    api_key="cerb_your_api_key",
    policy_id="your-policy-uuid",
    fail_open=True,
)
```

## Response Headers

All responses include standard rate limit headers:

- `X-RateLimit-Limit` — max requests in window
- `X-RateLimit-Remaining` — remaining requests
- `Retry-After` — seconds until reset (on 429)

## License

MIT
