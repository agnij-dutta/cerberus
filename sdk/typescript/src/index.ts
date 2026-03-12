/**
 * Cerberus TypeScript SDK — Rate limiting as a service.
 *
 * @example
 * ```typescript
 * const client = new CerberusClient({
 *   baseUrl: "http://localhost:8000",
 *   apiKey: "cerb_your_api_key",
 * });
 *
 * const result = await client.check("policy-uuid", "user:42");
 * if (result.allowed) {
 *   // proceed
 * }
 * ```
 */

export interface CerberusConfig {
  baseUrl: string;
  apiKey: string;
  /** Request timeout in milliseconds (default: 5000) */
  timeout?: number;
}

export interface CheckResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  retryAfterMs: number;
}

export interface Policy {
  id: string;
  tenantId: string;
  name: string;
  algorithm: "sliding_window" | "token_bucket";
  limit: number;
  windowSeconds: number;
  isActive: boolean;
}

export interface CreatePolicyParams {
  name: string;
  limit: number;
  windowSeconds: number;
  algorithm?: "sliding_window" | "token_bucket";
}

export class CerberusError extends Error {
  constructor(
    public statusCode: number,
    public detail: string,
  ) {
    super(`Cerberus API error ${statusCode}: ${detail}`);
    this.name = "CerberusError";
  }
}

export class RateLimitedError extends CerberusError {
  public retryAfter: number;

  constructor(retryAfter: number, detail: string = "Rate limited") {
    super(429, detail);
    this.name = "RateLimitedError";
    this.retryAfter = retryAfter;
  }
}

export class CerberusClient {
  private baseUrl: string;
  private apiKey: string;
  private timeout: number;

  constructor(config: CerberusConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.apiKey = config.apiKey;
    this.timeout = config.timeout ?? 5000;
  }

  /**
   * Check a rate limit.
   *
   * @param policyId - UUID of the policy to evaluate against
   * @param identifier - The key to rate limit (user ID, IP, etc.)
   * @param tokens - Number of tokens to consume (default: 1)
   */
  async check(policyId: string, identifier: string, tokens: number = 1): Promise<CheckResult> {
    const data = await this.request<{
      allowed: boolean;
      remaining: number;
      limit: number;
      retry_after_ms: number;
    }>("POST", "/check", { policy_id: policyId, identifier, tokens });

    return {
      allowed: data.allowed,
      remaining: data.remaining,
      limit: data.limit,
      retryAfterMs: data.retry_after_ms,
    };
  }

  /** Create a new rate limit policy. */
  async createPolicy(params: CreatePolicyParams): Promise<Policy> {
    const body: Record<string, unknown> = {
      name: params.name,
      algorithm: params.algorithm ?? "sliding_window",
      limit: params.limit,
      window_seconds: params.windowSeconds,
    };

    const data = await this.request<Record<string, unknown>>("POST", "/policies", body);
    return this.parsePolicy(data);
  }

  /** List all policies for the authenticated tenant. */
  async listPolicies(): Promise<Policy[]> {
    const data = await this.request<{ items: Record<string, unknown>[] }>("GET", "/policies");
    return data.items.map((p) => this.parsePolicy(p));
  }

  /** Get a specific policy by ID. */
  async getPolicy(policyId: string): Promise<Policy> {
    const data = await this.request<Record<string, unknown>>("GET", `/policies/${policyId}`);
    return this.parsePolicy(data);
  }

  /** Delete a policy. */
  async deletePolicy(policyId: string): Promise<void> {
    await this.request("DELETE", `/policies/${policyId}`);
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}/v1${path}`;

    const init: RequestInit = {
      method,
      headers: {
        "X-API-Key": this.apiKey,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(this.timeout),
    };

    if (body !== undefined) {
      init.body = JSON.stringify(body);
    }

    const response = await fetch(url, init);

    if (!response.ok) {
      let detail: string;
      try {
        const errorData = await response.json();
        detail = errorData.detail ?? response.statusText;
      } catch {
        detail = response.statusText;
      }

      if (response.status === 429) {
        const retryAfter = parseFloat(response.headers.get("Retry-After") ?? "1");
        throw new RateLimitedError(retryAfter, detail);
      }

      throw new CerberusError(response.status, detail);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  private parsePolicy(data: Record<string, unknown>): Policy {
    return {
      id: data.id as string,
      tenantId: data.tenant_id as string,
      name: data.name as string,
      algorithm: data.algorithm as Policy["algorithm"],
      limit: data.limit as number,
      windowSeconds: data.window_seconds as number,
      isActive: data.is_active as boolean,
    };
  }
}

export default CerberusClient;
