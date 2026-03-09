#!/bin/bash
set -e

# Seed script — creates a demo tenant and sample policies.
# Run after the stack is up:
#   ./scripts/seed-data.sh

BASE_URL="${CERBERUS_URL:-http://localhost:8000}"
ADMIN_KEY="${CERBERUS_ADMIN_API_KEY:-cerberus-admin-dev-key}"

echo "==> Seeding Cerberus at $BASE_URL"
echo ""

# Wait for backend to be ready
echo "Waiting for backend..."
for i in $(seq 1 30); do
    if curl -sf "$BASE_URL/health" > /dev/null 2>&1; then
        echo "Backend is ready."
        break
    fi
    if [ "$i" -eq 30 ]; then
        echo "ERROR: Backend did not become ready in time."
        exit 1
    fi
    sleep 1
done

echo ""
echo "==> Creating demo tenant..."
TENANT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/tenants" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: $ADMIN_KEY" \
    -d '{
        "name": "demo-app"
    }')

echo "$TENANT_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$TENANT_RESPONSE"

TENANT_ID=$(echo "$TENANT_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null || echo "unknown")
API_KEY=$(echo "$TENANT_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['api_key'])" 2>/dev/null || echo "unknown")

echo ""
echo "==> Creating rate limit policies..."

# Standard API policy: 100 requests per minute
echo "  -> Standard API policy (100 req/min, sliding window)"
curl -s -X POST "$BASE_URL/api/v1/policies" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: $API_KEY" \
    -d '{
        "name": "standard-api",
        "algorithm": "sliding_window",
        "limit": 100,
        "window_seconds": 60
    }' | python3 -m json.tool 2>/dev/null

echo ""

# Burst-friendly policy: 20 req/sec with burst to 50
echo "  -> Burst policy (20 req/sec, token bucket, burst 50)"
curl -s -X POST "$BASE_URL/api/v1/policies" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: $API_KEY" \
    -d '{
        "name": "burst-api",
        "algorithm": "token_bucket",
        "limit": 20,
        "window_seconds": 1,
        "burst_limit": 50
    }' | python3 -m json.tool 2>/dev/null

echo ""

# Strict login policy: 5 attempts per 15 minutes
echo "  -> Login policy (5 req/15min, fixed window)"
curl -s -X POST "$BASE_URL/api/v1/policies" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: $API_KEY" \
    -d '{
        "name": "login-limiter",
        "algorithm": "fixed_window",
        "limit": 5,
        "window_seconds": 900
    }' | python3 -m json.tool 2>/dev/null

echo ""
echo "==> Seed complete!"
echo ""
echo "Your demo credentials:"
echo "  Tenant ID:  $TENANT_ID"
echo "  API Key:    $API_KEY"
echo ""
echo "Try a rate limit check:"
echo "  curl -X POST $BASE_URL/api/v1/check \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -H 'X-API-Key: $API_KEY' \\"
echo "    -d '{\"key\": \"user:123\", \"policy\": \"standard-api\"}'"
