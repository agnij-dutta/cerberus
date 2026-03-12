# @cerberus/sdk

TypeScript SDK for [Cerberus](https://github.com/agnij-dutta/cerberus) — rate limiting infrastructure for modern APIs.

## Installation

```bash
npm install @cerberus/sdk
```

## Quick Start

```typescript
import { CerberusClient } from "@cerberus/sdk";

const client = new CerberusClient({
  baseUrl: "https://api.cerberus.dev",
  apiKey: "cerb_your_api_key",
});

const result = await client.check("user:42", "api-default");

if (result.allowed) {
  console.log(`OK — ${result.remaining}/${result.limit} remaining`);
} else {
  console.log(`Rate limited. Retry after ${result.retryAfter}s`);
}
```

## API

### `new CerberusClient(config)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `baseUrl` | `string` | — | Cerberus API URL |
| `apiKey` | `string` | — | Your tenant API key |
| `timeout` | `number` | `5000` | Request timeout (ms) |

### `client.check(key, policy, cost?) -> CheckResult`

| Field | Type | Description |
|-------|------|-------------|
| `allowed` | `boolean` | Whether the request is allowed |
| `remaining` | `number` | Requests remaining in window |
| `limit` | `number` | Total requests allowed per window |
| `reset` | `number` | Unix timestamp when window resets |
| `retryAfter` | `number \| null` | Seconds to wait (if limited) |

### `client.createPolicy(params) -> Policy`
### `client.listPolicies() -> Policy[]`
### `client.deletePolicy(policyId) -> void`

## Framework Middleware

- **Express**: [`cerberus-express`](https://www.npmjs.com/package/cerberus-express)
- **FastAPI**: [`cerberus-fastapi`](https://pypi.org/project/cerberus-fastapi/)

## License

MIT
