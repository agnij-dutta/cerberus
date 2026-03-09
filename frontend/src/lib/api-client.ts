import { API_URL } from "./constants";

/**
 * Typed API client for the Cerberus backend.
 * Wraps fetch with proper headers, error handling, and response typing.
 */

// ── Types ──────────────────────────────────────────

export interface CheckRequest {
  key: string;
  policy?: string;
  limit?: number;
  window_seconds?: number;
}

export interface CheckResponse {
  allowed: boolean;
  remaining: number;
  limit: number;
  reset_at: number;
  retry_after: number | null;
}

export interface Policy {
  id: string;
  tenant_id: string;
  name: string;
  algorithm: "sliding_window" | "token_bucket";
  limit: number;
  window_seconds: number;
  refill_rate: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PolicyCreate {
  name: string;
  algorithm: "sliding_window" | "token_bucket";
  limit: number;
  window_seconds: number;
  refill_rate?: number;
}

export interface Tenant {
  id: string;
  name: string;
  api_key_prefix: string;
  is_active: boolean;
  tier: "free" | "pro" | "enterprise";
  created_at: string;
  updated_at: string;
}

export interface TenantCreate {
  name: string;
  tier?: "free" | "pro" | "enterprise";
}

export interface TenantCreateResponse extends Tenant {
  api_key: string; // Only returned on creation
}

export interface AnalyticsData {
  total_requests: number;
  allowed_requests: number;
  blocked_requests: number;
  block_rate: number;
  avg_latency_ms: number;
  p99_latency_ms: number;
  top_keys: Array<{ key: string; count: number }>;
  timeline: Array<{
    timestamp: string;
    allowed: number;
    blocked: number;
  }>;
}

export interface HealthResponse {
  status: string;
  redis: string;
  postgres: string;
  uptime_seconds: number;
}

export interface ApiError {
  type: string;
  title: string;
  status: number;
  detail: string;
}

// ── Client ──────────────────────────────────────────

class CerberusClient {
  private baseUrl: string;
  private apiKey: string | null = null;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  setApiKey(key: string) {
    this.apiKey = key;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.apiKey) {
      headers["X-API-Key"] = this.apiKey;
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const error: ApiError = await res.json().catch(() => ({
        type: "unknown",
        title: "Request Failed",
        status: res.status,
        detail: res.statusText,
      }));
      throw error;
    }

    return res.json();
  }

  // Rate limit check
  async check(req: CheckRequest): Promise<CheckResponse> {
    return this.request<CheckResponse>("/v1/check", {
      method: "POST",
      body: JSON.stringify(req),
    });
  }

  // Policies
  async listPolicies(): Promise<Policy[]> {
    return this.request<Policy[]>("/v1/policies");
  }

  async getPolicy(id: string): Promise<Policy> {
    return this.request<Policy>(`/v1/policies/${id}`);
  }

  async createPolicy(data: PolicyCreate): Promise<Policy> {
    return this.request<Policy>("/v1/policies", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updatePolicy(id: string, data: Partial<PolicyCreate>): Promise<Policy> {
    return this.request<Policy>(`/v1/policies/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deletePolicy(id: string): Promise<void> {
    await this.request(`/v1/policies/${id}`, { method: "DELETE" });
  }

  // Tenants
  async listTenants(): Promise<Tenant[]> {
    return this.request<Tenant[]>("/v1/tenants");
  }

  async createTenant(data: TenantCreate): Promise<TenantCreateResponse> {
    return this.request<TenantCreateResponse>("/v1/tenants", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Analytics
  async getAnalytics(params?: {
    window?: string;
    tenant_id?: string;
  }): Promise<AnalyticsData> {
    const query = new URLSearchParams(params as Record<string, string>);
    return this.request<AnalyticsData>(`/v1/analytics?${query}`);
  }

  // Health
  async health(): Promise<HealthResponse> {
    return this.request<HealthResponse>("/healthz");
  }

  async ready(): Promise<HealthResponse> {
    return this.request<HealthResponse>("/readyz");
  }
}

// Singleton instance
export const cerberus = new CerberusClient();
export default CerberusClient;
