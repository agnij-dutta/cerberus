/**
 * k6 load test for Cerberus rate-limit check endpoint.
 *
 * Usage:
 *   k6 run loadtest/k6_script.js
 *
 * Environment variables:
 *   CERBERUS_BASE_URL   — base URL of the service (default: http://localhost:8000)
 *   CERBERUS_API_KEY    — API key for the test tenant
 *   CERBERUS_POLICY_ID  — UUID of the policy to test against
 *
 * This script runs three stages:
 *   1. Ramp-up:   0 → 100 VUs over 30 seconds
 *   2. Sustained: 100 VUs for 2 minutes
 *   3. Ramp-down: 100 → 0 VUs over 10 seconds
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const BASE_URL = __ENV.CERBERUS_BASE_URL || "http://localhost:8000";
const API_KEY = __ENV.CERBERUS_API_KEY || "cerb_test_key_placeholder";
const POLICY_ID =
  __ENV.CERBERUS_POLICY_ID || "11111111-2222-3333-4444-555555555555";

export const options = {
  stages: [
    { duration: "30s", target: 100 },
    { duration: "2m", target: 100 },
    { duration: "10s", target: 0 },
  ],
  thresholds: {
    // p95 latency should be under 50ms for the check endpoint
    "http_req_duration{name:check}": ["p(95)<50"],
    // Error rate (non-200/429) should be under 1%
    cerberus_error_rate: ["rate<0.01"],
    // At least 50% of requests should be allowed (depends on policy config)
    cerberus_allowed_rate: ["rate>0.1"],
  },
};

// ---------------------------------------------------------------------------
// Custom metrics
// ---------------------------------------------------------------------------

const errorRate = new Rate("cerberus_error_rate");
const allowedRate = new Rate("cerberus_allowed_rate");
const checkLatency = new Trend("cerberus_check_latency", true);

// Pre-generate identifiers
const identifiers = [];
for (let i = 0; i < 200; i++) {
  identifiers.push(`k6-user-${i}`);
}

// ---------------------------------------------------------------------------
// Test scenarios
// ---------------------------------------------------------------------------

export default function () {
  const identifier = identifiers[Math.floor(Math.random() * identifiers.length)];

  const payload = JSON.stringify({
    policy_id: POLICY_ID,
    identifier: identifier,
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
    },
    tags: { name: "check" },
  };

  const res = http.post(`${BASE_URL}/v1/check`, payload, params);

  checkLatency.add(res.timings.duration);

  const isExpectedStatus = res.status === 200 || res.status === 429;
  errorRate.add(!isExpectedStatus);

  if (res.status === 200) {
    const body = JSON.parse(res.body);
    allowedRate.add(body.allowed === true);

    check(res, {
      "status is 200": (r) => r.status === 200,
      "body has allowed field": () => body.allowed !== undefined,
      "has rate limit headers": (r) =>
        r.headers["X-Ratelimit-Limit"] !== undefined,
    });
  } else if (res.status === 429) {
    allowedRate.add(false);

    check(res, {
      "status is 429": (r) => r.status === 429,
      "has retry-after header": (r) => r.headers["Retry-After"] !== undefined,
    });
  } else {
    console.error(`Unexpected status ${res.status}: ${res.body}`);
  }

  // Small pause between requests to simulate realistic spacing
  sleep(Math.random() * 0.02);
}

// ---------------------------------------------------------------------------
// Lifecycle hooks
// ---------------------------------------------------------------------------

export function setup() {
  // Verify the service is reachable
  const healthRes = http.get(`${BASE_URL}/healthz`);
  check(healthRes, {
    "service is alive": (r) => r.status === 200,
  });

  if (healthRes.status !== 200) {
    throw new Error(`Service not reachable at ${BASE_URL}`);
  }

  console.log(`Testing against ${BASE_URL} with policy ${POLICY_ID}`);
}

export function teardown() {
  console.log("Load test complete.");
}
