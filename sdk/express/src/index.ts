import type { Request, Response, NextFunction, RequestHandler } from "express";

// ── Types ──────────────────────────────────────────────────────────────

export interface CerberusConfig {
  baseUrl: string;
  apiKey: string;
  /** Request timeout in milliseconds (default: 5000) */
  timeout?: number;
}

export interface RateLimitOptions {
  /** UUID of the Cerberus policy to enforce */
  policyId: string;
  /** Extract the rate limit identifier from the request (default: client IP) */
  identifierFn?: (req: Request) => string;
  /** Number of tokens to consume per request (default: 1) */
  tokens?: number;
  /** Allow requests through when Cerberus is unreachable (default: false) */
  failOpen?: boolean;
}

interface CheckResponse {
  allowed: boolean;
  remaining: number;
  limit: number;
  retry_after_ms: number;
}

// ── Client ─────────────────────────────────────────────────────────────

class CerberusInternalClient {
  private baseUrl: string;
  private apiKey: string;
  private timeout: number;

  constructor(config: CerberusConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.apiKey = config.apiKey;
    this.timeout = config.timeout ?? 5000;
  }

  async check(policyId: string, identifier: string, tokens: number = 1): Promise<CheckResponse> {
    const url = `${this.baseUrl}/v1/check`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "X-API-Key": this.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ policy_id: policyId, identifier, tokens }),
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      throw new Error(`Cerberus API error ${response.status}`);
    }

    return response.json() as Promise<CheckResponse>;
  }
}

// ── Default identifier ─────────────────────────────────────────────────

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.ip ?? req.socket.remoteAddress ?? "unknown";
}

// ── Middleware factory ─────────────────────────────────────────────────

/**
 * Create a Cerberus rate limiting middleware for Express.
 *
 * @example
 * ```typescript
 * import express from "express";
 * import { createRateLimiter } from "@cerberus/express";
 *
 * const app = express();
 *
 * // Apply globally
 * app.use(createRateLimiter(
 *   { baseUrl: "https://api.cerberus.dev", apiKey: "cerb_xxx" },
 *   { policyId: "your-policy-uuid" },
 * ));
 *
 * // Or per-route
 * const limiter = createRateLimiter(
 *   { baseUrl: "https://api.cerberus.dev", apiKey: "cerb_xxx" },
 *   { policyId: "your-policy-uuid" },
 * );
 * app.get("/api/resource", limiter, (req, res) => {
 *   res.json({ data: "ok" });
 * });
 * ```
 */
export function createRateLimiter(
  config: CerberusConfig,
  options: RateLimitOptions,
): RequestHandler {
  const client = new CerberusInternalClient(config);
  const identifierFn = options.identifierFn ?? getClientIp;
  const tokens = options.tokens ?? 1;
  const failOpen = options.failOpen ?? false;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const identifier = identifierFn(req);

    let result: CheckResponse;
    try {
      result = await client.check(options.policyId, identifier, tokens);
    } catch (err) {
      if (!failOpen) {
        res.status(503).json({ detail: "Rate limit service unavailable" });
        return;
      }
      next();
      return;
    }

    res.setHeader("X-RateLimit-Limit", String(result.limit));
    res.setHeader("X-RateLimit-Remaining", String(result.remaining));

    if (!result.allowed) {
      res.setHeader("Retry-After", String(result.retry_after_ms / 1000));
      res.status(429).json({
        detail: "Rate limit exceeded",
        retry_after_ms: result.retry_after_ms,
      });
      return;
    }

    next();
  };
}

export default createRateLimiter;
