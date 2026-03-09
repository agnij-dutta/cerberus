#!/bin/bash
set -e

# This script runs inside the postgres container on first boot.
# It's mounted into /docker-entrypoint-initdb.d/

echo "==> Initializing Cerberus database..."

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Ensure the cerberus role exists (idempotent)
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'cerberus') THEN
            CREATE ROLE cerberus WITH LOGIN PASSWORD 'cerberus';
        END IF;
    END
    \$\$;

    -- Grant privileges
    GRANT ALL PRIVILEGES ON DATABASE cerberus TO cerberus;
    GRANT ALL ON SCHEMA public TO cerberus;

    -- Install extensions we need
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pg_trgm";

    -- Create base tables if they don't exist yet
    -- (Alembic handles the real migrations, but this gives us a working DB
    -- even without running migrate)

    CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        api_key VARCHAR(64) NOT NULL UNIQUE,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS policies (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        algorithm VARCHAR(50) NOT NULL DEFAULT 'sliding_window',
        limit_value INTEGER NOT NULL,
        window_seconds INTEGER NOT NULL,
        burst_limit INTEGER,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(tenant_id, name)
    );

    CREATE INDEX IF NOT EXISTS idx_tenants_api_key ON tenants(api_key);
    CREATE INDEX IF NOT EXISTS idx_policies_tenant_id ON policies(tenant_id);

EOSQL

echo "==> Cerberus database initialized."
