/**
 * Cerberus API client.
 *
 * Uses JWT Bearer tokens for dashboard auth (email/password login).
 * Also sends X-API-Key for policy/analytics endpoints that require tenant key auth.
 *
 * In production (Vercel), requests are proxied via `/api/v1` rewrites.
 * In local development, we hit the backend directly at localhost:8000.
 */

// ---------------------------------------------------------------------------
// Base URL resolution
// ---------------------------------------------------------------------------

function getBaseUrl(): string {
  if (typeof window === "undefined") return "/api/v1";
  const isDev =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
  return isDev ? "http://localhost:8000/v1" : "/api/v1";
}

// ---------------------------------------------------------------------------
// Token management
// ---------------------------------------------------------------------------

const JWT_KEY = "cerberus_jwt";
const API_KEY_KEY = "cerberus_api_key";

export function getStoredJWT(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(JWT_KEY);
}

export function setStoredJWT(token: string): void {
  localStorage.setItem(JWT_KEY, token);
}

export function getStoredApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(API_KEY_KEY);
}

export function setStoredApiKey(key: string): void {
  localStorage.setItem(API_KEY_KEY, key);
}

export function clearStoredTokens(): void {
  localStorage.removeItem(JWT_KEY);
  localStorage.removeItem(API_KEY_KEY);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Tenant {
  id: string;
  name: string;
  email: string;
  tier: "free" | "pro" | "enterprise";
  is_active: boolean;
  created_at: string;
}

export interface SignupResponse {
  tenant: { id: string; name: string; email: string; tier: string };
  access_token: string;
  api_key: string;
}

export interface LoginResponse {
  tenant: { id: string; name: string; email: string; tier: string };
  access_token: string;
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

export interface PolicyCreateData {
  name: string;
  algorithm: "sliding_window" | "token_bucket";
  limit: number;
  window_seconds?: number;
  refill_rate?: number;
}

export interface PolicyUpdateData {
  name?: string;
  limit?: number;
  window_seconds?: number;
  refill_rate?: number;
  is_active?: boolean;
}

export interface PolicyListResponse {
  items: Policy[];
  total: number;
  offset: number;
  limit: number;
}

export interface DailyStats {
  date: string;
  total_checks: number;
  rejected_checks: number;
  allowed_checks: number;
}

export interface AnalyticsResponse {
  tenant_id: string;
  days: DailyStats[];
  total_checks: number;
  total_rejected: number;
}

export interface ApiError {
  type?: string;
  title?: string;
  status: number;
  detail: string;
}

// ---------------------------------------------------------------------------
// HTTP client
// ---------------------------------------------------------------------------

export class CerberusApiError extends Error {
  status: number;
  detail: string;

  constructor(error: ApiError) {
    super(error.detail || error.title || "API Error");
    this.name = "CerberusApiError";
    this.status = error.status;
    this.detail = error.detail;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  // Attach JWT Bearer token for dashboard auth
  const jwt = getStoredJWT();
  if (jwt) {
    headers["Authorization"] = `Bearer ${jwt}`;
  }

  // Also attach API key for endpoints that need it
  const apiKey = getStoredApiKey();
  if (apiKey) {
    headers["X-API-Key"] = apiKey;
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 204) return undefined as T;

  if (!response.ok) {
    let errorBody: ApiError;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = { status: response.status, detail: response.statusText || "Request failed" };
    }

    if (response.status === 401 || response.status === 403) {
      clearStoredTokens();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }

    throw new CerberusApiError({ ...errorBody, status: response.status });
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// API methods
// ---------------------------------------------------------------------------

export const api = {
  // -- Auth (JWT-based) ----------------------------------------------------

  async signup(name: string, email: string, password: string): Promise<SignupResponse> {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!response.ok) {
      let errorBody: ApiError;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = { status: response.status, detail: "Signup failed" };
      }
      throw new CerberusApiError({ ...errorBody, status: response.status });
    }

    const data: SignupResponse = await response.json();
    setStoredJWT(data.access_token);
    setStoredApiKey(data.api_key);
    return data;
  },

  async login(email: string, password: string): Promise<LoginResponse> {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      let errorBody: ApiError;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = { status: response.status, detail: "Login failed" };
      }
      throw new CerberusApiError({ ...errorBody, status: response.status });
    }

    const data: LoginResponse = await response.json();
    setStoredJWT(data.access_token);
    return data;
  },

  async getMe(): Promise<Tenant> {
    return request<Tenant>("/auth/me");
  },

  logout(): void {
    clearStoredTokens();
  },

  // -- Policies ------------------------------------------------------------

  async listPolicies(offset = 0, limit = 50): Promise<PolicyListResponse> {
    return request<PolicyListResponse>(`/policies?offset=${offset}&limit=${limit}`);
  },

  async createPolicy(data: PolicyCreateData): Promise<Policy> {
    return request<Policy>("/policies", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updatePolicy(id: string, data: PolicyUpdateData): Promise<Policy> {
    return request<Policy>(`/policies/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async deletePolicy(id: string): Promise<void> {
    return request<void>(`/policies/${id}`, { method: "DELETE" });
  },

  // -- Analytics -----------------------------------------------------------

  async getAnalytics(days = 7): Promise<AnalyticsResponse> {
    return request<AnalyticsResponse>(`/analytics?days=${days}`);
  },
};

export default api;
