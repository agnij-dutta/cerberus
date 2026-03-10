export interface Tenant {
  id: string;
  name: string;
  email: string;
  tier: "free" | "pro" | "enterprise";
  is_active: boolean;
  created_at: string;
  api_key_prefix?: string;
  updated_at?: string;
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

export interface CreatePolicyData {
  name: string;
  algorithm: "sliding_window" | "token_bucket";
  limit: number;
  window_seconds: number;
  refill_rate?: number;
}

export interface AnalyticsData {
  total_checks: number;
  allowed_checks: number;
  rejected_checks: number;
  daily: Array<{
    date: string;
    total: number;
    allowed: number;
    rejected: number;
  }>;
}
