# @cerberus/express

Express middleware for [Cerberus](https://github.com/agnij-dutta/cerberus) Rate-Limit-as-a-Service.

## Installation

```bash
npm install @cerberus/express
```

## Quick Start

### Global middleware

```typescript
import express from "express";
import { createRateLimiter } from "@cerberus/express";

const app = express();

app.use(createRateLimiter(
  { baseUrl: "https://api.cerberus.dev", apiKey: "cerb_xxx" },
  { policyId: "your-policy-uuid" },
));

app.get("/", (req, res) => {
  res.json({ message: "Hello!" });
});
```

### Per-route

```typescript
const limiter = createRateLimiter(
  { baseUrl: "https://api.cerberus.dev", apiKey: "cerb_xxx" },
  { policyId: "strict-policy-uuid" },
);

app.get("/api/resource", limiter, (req, res) => {
  res.json({ data: "ok" });
});
```

### Custom identifier

```typescript
app.use(createRateLimiter(
  { baseUrl: "https://api.cerberus.dev", apiKey: "cerb_xxx" },
  {
    policyId: "your-policy-uuid",
    identifierFn: (req) => req.headers.authorization ?? "anon",
  },
));
```

### Fail open

Allow requests through when Cerberus is unreachable:

```typescript
app.use(createRateLimiter(
  { baseUrl: "https://api.cerberus.dev", apiKey: "cerb_xxx" },
  { policyId: "your-policy-uuid", failOpen: true },
));
```

## Response Headers

All responses include standard rate limit headers:

- `X-RateLimit-Limit` — max requests in window
- `X-RateLimit-Remaining` — remaining requests
- `Retry-After` — seconds until reset (on 429)

## License

MIT
